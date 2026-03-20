import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle, MapPin, Phone, ShieldCheck, Clock, Flag,
  CheckCircle2, Globe, XCircle, ExternalLink
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { PostPublic, Ngo, CreateReportInputReason } from "@workspace/api-client-react";
import { useCreateReport, CreateReportInputReason as ReasonEnum } from "@workspace/api-client-react";

interface PostDetailsModalProps {
  item: PostPublic | Ngo | null;
  isOpen: boolean;
  onClose: () => void;
  type: 'post' | 'ngo';
}

const REPORT_REASONS = Object.values(ReasonEnum) as CreateReportInputReason[];

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/30',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  expired: 'bg-muted text-muted-foreground border-border',
};

export function PostDetailsModal({ item, isOpen, onClose, type }: PostDetailsModalProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const dateLocale = isRtl ? ar : enUS;

  const [showReport, setShowReport] = useState(false);
  const [selectedReason, setSelectedReason] = useState<CreateReportInputReason>(ReasonEnum.spam);
  const [reportDetails, setReportDetails] = useState('');
  const [reportDone, setReportDone] = useState(false);

  const createReport = useCreateReport();

  if (!item) return null;

  const isNgo = type === 'ngo';
  const isPost = type === 'post';
  const post = isPost ? (item as PostPublic) : null;
  const ngo = isNgo ? (item as Ngo) : null;

  const title = post ? post.title : ngo?.name;
  const description = post ? post.description : ngo?.description;
  const governorate = post ? post.governorate : ngo?.governorate;
  const district = post ? post.district : ngo?.district;
  const contactInfo = post ? post.contactInfo : ngo?.phone;
  const contactMethod = post ? post.contactMethod : 'phone';
  const timestamp = post ? new Date(post.updatedAt) : ngo ? new Date(ngo.createdAt) : new Date();

  const handleClose = () => {
    setShowReport(false);
    setReportDone(false);
    setReportDetails('');
    setSelectedReason(ReasonEnum.spam);
    createReport.reset();
    onClose();
  };

  const handleReport = () => {
    if (!post) return;
    createReport.mutate(
      { data: { postId: post.id, reason: selectedReason } },
      { onSuccess: () => setReportDone(true) }
    );
  };

  const statusKey = post?.status ? `status_${post.status}` : null;
  const statusColor = post?.status ? (STATUS_COLORS[post.status] ?? STATUS_COLORS.expired) : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md w-[95vw] rounded-2xl p-0 overflow-hidden bg-card border-border shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header Color Bar */}
        <div className={`h-16 w-full shrink-0 ${
          isNgo ? 'bg-info' :
          post?.postType === 'need' ? 'bg-destructive' : 'bg-success'
        } flex items-center px-6 relative`}>
          <div className="absolute -bottom-6 right-6">
            <div className="w-12 h-12 rounded-full bg-background border-4 border-card flex items-center justify-center shadow-sm">
              {isNgo ? <ShieldCheck className="w-6 h-6 text-info" /> :
               post?.postType === 'need' ? <AlertTriangle className="w-6 h-6 text-destructive" /> :
               <HeartHandshake className="w-6 h-6 text-success" />}
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex flex-col">
          <div className="p-6 pt-8 flex flex-col gap-5">
            <DialogHeader>
              <div className="flex flex-wrap gap-2 mb-3">
                {isNgo && (
                  <Badge variant="secondary" className="bg-info/10 text-info hover:bg-info/20">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    {t('verified_ngo')}
                  </Badge>
                )}
                {isPost && post && (
                  <>
                    <Badge
                      variant="outline"
                      className={`font-medium text-xs ${post.postType === 'need' ? 'border-destructive/40 text-destructive' : 'border-success/40 text-success'}`}
                    >
                      {t(post.postType)}
                    </Badge>
                    <Badge variant="outline" className="border-border text-muted-foreground">
                      {t(post.category)}
                    </Badge>
                    {post.postType === 'need' && post.urgency && (
                      <Badge variant={post.urgency === 'critical' ? 'destructive' : 'secondary'}>
                        {t(post.urgency)}
                      </Badge>
                    )}
                    {statusKey && statusColor && (
                      <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusColor}`}>
                        {t(statusKey)}
                      </span>
                    )}
                  </>
                )}
              </div>

              <DialogTitle className="text-xl font-bold text-foreground leading-tight mb-2">
                {title}
              </DialogTitle>

              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {formatDistanceToNow(timestamp, { addSuffix: true, locale: dateLocale })}
                </span>
              </div>
            </DialogHeader>

            {/* Description */}
            <DialogDescription className="text-base text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {description || t('no_description')}
            </DialogDescription>

            {/* Details card */}
            <div className="bg-secondary/50 rounded-xl p-4 flex flex-col gap-3 border border-border/50">

              {/* Location */}
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground text-sm">{governorate}</p>
                  {district && <p className="text-sm text-muted-foreground">{district}</p>}
                </div>
              </div>

              {/* Provider type — offers only */}
              {isPost && post?.providerType && post.postType === 'offer' && (
                <div className="flex items-start gap-3 pt-3 border-t border-border/50">
                  <div className="w-4 h-4 mt-0.5 shrink-0 flex items-center justify-center">
                    <span className="text-muted-foreground text-xs">🏷</span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{t('provider_type')}</p>
                    <p className="text-sm font-semibold text-foreground">{t(post.providerType)}</p>
                  </div>
                </div>
              )}

              {/* Expiry — posts only */}
              {isPost && post?.expiresAt && (
                <div className="flex items-start gap-3 pt-3 border-t border-border/50">
                  <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{t('expires')}</p>
                    <p className="text-sm text-foreground">
                      {format(new Date(post.expiresAt), 'PPP', { locale: dateLocale })}
                    </p>
                  </div>
                </div>
              )}

              {/* Contact info */}
              {contactInfo && (
                <div className="flex items-start gap-3 pt-3 border-t border-border/50">
                  <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{t('contact_info')}</p>
                    <a
                      href={`tel:${contactInfo.replace(/\s/g, '')}`}
                      className="text-sm text-primary font-semibold hover:underline block"
                      dir="ltr"
                    >
                      {contactInfo}
                    </a>
                    {contactMethod && (
                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">{contactMethod}</p>
                    )}
                  </div>
                </div>
              )}

              {/* NGO website */}
              {isNgo && ngo?.website && (
                <div className="flex items-start gap-3 pt-3 border-t border-border/50">
                  <Globe className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{t('website')}</p>
                    <a
                      href={ngo.website.startsWith('http') ? ngo.website : `https://${ngo.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
                    >
                      {ngo.website.replace(/^https?:\/\//, '')}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Report panel — only for posts */}
            {isPost && !showReport && !reportDone && (
              <div className="flex gap-3 mt-1">
                <Button
                  variant="outline"
                  className="flex-1 text-muted-foreground hover:text-destructive hover:border-destructive/40 text-sm"
                  onClick={() => setShowReport(true)}
                >
                  <Flag className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                  {t('report_post')}
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90 shadow-md text-sm"
                  onClick={handleClose}
                >
                  {t('close')}
                </Button>
              </div>
            )}

            {isPost && showReport && !reportDone && (
              <div className="flex flex-col gap-3 mt-1 bg-destructive/5 border border-destructive/20 rounded-xl p-4">
                <p className="text-sm font-semibold text-foreground">{t('report_reason')}</p>
                <div className="flex flex-wrap gap-2">
                  {REPORT_REASONS.map(r => (
                    <button
                      key={r}
                      onClick={() => setSelectedReason(r)}
                      className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors ${
                        selectedReason === r
                          ? 'bg-destructive text-destructive-foreground border-destructive'
                          : 'bg-background border-border text-foreground hover:border-destructive/40'
                      }`}
                    >
                      {t(`reason_${r}`, { defaultValue: r })}
                    </button>
                  ))}
                </div>

                {/* Optional details */}
                <textarea
                  value={reportDetails}
                  onChange={e => setReportDetails(e.target.value)}
                  placeholder={t('report_details_placeholder')}
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-destructive/30 resize-none text-foreground placeholder:text-muted-foreground"
                />

                {/* Error state */}
                {createReport.isError && (
                  <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg px-3 py-2">
                    <XCircle className="w-4 h-4 shrink-0" />
                    {t('report_error')}
                  </div>
                )}

                <div className="flex gap-2 mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => { setShowReport(false); createReport.reset(); }}
                    disabled={createReport.isPending}
                  >
                    {t('cancel')}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={handleReport}
                    disabled={createReport.isPending}
                  >
                    {createReport.isPending ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        {t('submit_report')}
                      </span>
                    ) : t('submit_report')}
                  </Button>
                </div>
              </div>
            )}

            {reportDone && (
              <div className="flex items-center gap-3 bg-success/10 border border-success/30 rounded-xl p-4 mt-1">
                <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                <p className="text-sm text-foreground">{t('report_thanks')}</p>
              </div>
            )}

            {isNgo && (
              <Button className="w-full bg-primary hover:bg-primary/90 mt-1" onClick={handleClose}>
                {t('close')}
              </Button>
            )}

            {reportDone && (
              <Button variant="outline" className="w-full" onClick={handleClose}>
                {t('close')}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HeartHandshake(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      <path d="M12 5 9.04 9.2a2.25 2.25 0 0 0-1.04 1.8v0A2.25 2.25 0 0 0 10.25 13h0A2.25 2.25 0 0 0 12 10.8V5Z" />
      <path d="M12 5l2.96 4.2a2.25 2.25 0 0 1 1.04 1.8v0a2.25 2.25 0 0 1-2.25 2h0a2.25 2.25 0 0 1-1.75-2.2V5Z" />
    </svg>
  );
}
